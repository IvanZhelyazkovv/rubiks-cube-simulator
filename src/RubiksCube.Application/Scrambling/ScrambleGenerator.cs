using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Application.Scrambling;

/// <summary>
/// Generates random scramble sequences. Consecutive moves never use the same face,
/// so a scramble cannot trivially cancel itself (e.g. <c>F F'</c>) or collapse
/// (e.g. <c>F F</c> into <c>F2</c>).
/// </summary>
public sealed class ScrambleGenerator
{
    private static readonly Face[] Faces = Enum.GetValues<Face>();
    private static readonly RotationDirection[] Directions = Enum.GetValues<RotationDirection>();

    private readonly Random _random;

    /// <summary>Creates a generator, optionally seeded for reproducible scrambles.</summary>
    /// <param name="seed">A seed for deterministic output; random when omitted.</param>
    public ScrambleGenerator(int? seed = null)
    {
        _random = seed is { } value ? new Random(value) : Random.Shared;
    }

    /// <summary>Generates a scramble of the given <paramref name="length"/>.</summary>
    /// <param name="length">The number of moves to generate.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when the length is not positive.</exception>
    public MoveSequence Generate(int length)
    {
        if (length < 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(length), length, "Scramble length must be at least 1.");
        }

        var moves = new List<Move>(length);
        Face? previousFace = null;

        for (var i = 0; i < length; i++)
        {
            Face face;
            do
            {
                face = Faces[_random.Next(Faces.Length)];
            }
            while (face == previousFace);

            previousFace = face;
            moves.Add(new Move(face, Directions[_random.Next(Directions.Length)]));
        }

        return MoveSequence.Of(moves);
    }
}
