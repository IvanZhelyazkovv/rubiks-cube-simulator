using System.Collections;
using System.Collections.Immutable;

namespace RubiksCube.Domain.Moves;

/// <summary>
/// An ordered, immutable sequence of <see cref="Move"/>s, convertible to and from
/// Singmaster notation such as <c>"F R' U B' L D'"</c>.
/// </summary>
public sealed class MoveSequence : IReadOnlyList<Move>
{
    /// <summary>An empty sequence.</summary>
    public static readonly MoveSequence Empty = new(ImmutableArray<Move>.Empty);

    private readonly ImmutableArray<Move> _moves;

    private MoveSequence(ImmutableArray<Move> moves)
    {
        _moves = moves;
    }

    /// <inheritdoc />
    public int Count => _moves.Length;

    /// <inheritdoc />
    public Move this[int index] => _moves[index];

    /// <summary>Creates a sequence from the given moves.</summary>
    /// <param name="moves">The moves of the sequence, in order.</param>
    public static MoveSequence Of(params IEnumerable<Move> moves) =>
        new([.. moves]);

    /// <summary>
    /// Parses a whitespace-separated Singmaster notation string, e.g. <c>"F R' U2"</c>.
    /// Face letters must be upper case; each may be followed by <c>'</c> (counter-clockwise)
    /// or <c>2</c> (half turn).
    /// </summary>
    /// <param name="notation">The notation string to parse.</param>
    /// <exception cref="InvalidMoveNotationException">
    /// Thrown when the input contains anything that is not valid notation.
    /// </exception>
    public static MoveSequence Parse(string notation)
    {
        ArgumentNullException.ThrowIfNull(notation);

        var moves = ImmutableArray.CreateBuilder<Move>();
        var position = 0;

        while (position < notation.Length)
        {
            if (char.IsWhiteSpace(notation[position]))
            {
                position++;
                continue;
            }

            var face = notation[position] switch
            {
                'U' => Face.Up,
                'D' => Face.Down,
                'F' => Face.Front,
                'B' => Face.Back,
                'L' => Face.Left,
                'R' => Face.Right,
                _ => throw new InvalidMoveNotationException(notation, position),
            };

            position++;
            var direction = RotationDirection.Clockwise;

            if (position < notation.Length)
            {
                switch (notation[position])
                {
                    case '\'':
                        direction = RotationDirection.CounterClockwise;
                        position++;
                        break;
                    case '2':
                        direction = RotationDirection.HalfTurn;
                        position++;
                        break;
                }
            }

            moves.Add(new Move(face, direction));
        }

        return new MoveSequence(moves.ToImmutable());
    }

    /// <summary>
    /// Attempts to parse Singmaster notation, returning <see langword="false"/>
    /// instead of throwing on invalid input.
    /// </summary>
    /// <param name="notation">The notation string to parse.</param>
    /// <param name="sequence">The parsed sequence, or <see cref="Empty"/> when parsing fails.</param>
    public static bool TryParse(string notation, out MoveSequence sequence)
    {
        try
        {
            sequence = Parse(notation);
            return true;
        }
        catch (InvalidMoveNotationException)
        {
            sequence = Empty;
            return false;
        }
    }

    /// <summary>
    /// Returns the sequence that exactly undoes this one:
    /// the inverses of the moves, in reverse order.
    /// </summary>
    public MoveSequence Inverse() =>
        new([.. _moves.Reverse().Select(move => move.Inverse)]);

    /// <summary>Returns the sequence in Singmaster notation, e.g. <c>"F R' U2"</c>.</summary>
    public override string ToString() => string.Join(' ', _moves);

    /// <inheritdoc />
    public IEnumerator<Move> GetEnumerator() => ((IEnumerable<Move>)_moves).GetEnumerator();

    /// <inheritdoc />
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
