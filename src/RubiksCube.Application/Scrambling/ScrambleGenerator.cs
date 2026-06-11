using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Application.Scrambling;

/// <summary>
/// Generates random scramble sequences over every layer of the cube — face turns
/// and inner slices alike, since a face-turn-only scramble can never move the
/// inner centre stickers of a 4×4 or larger. Consecutive moves never use the
/// same face, so a scramble cannot trivially cancel itself (e.g. <c>F F'</c>)
/// or collapse (e.g. <c>F F</c> into <c>F2</c>).
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

    /// <summary>
    /// Generates a scramble of the given <paramref name="length"/> for a cube of
    /// the given <paramref name="size"/>.
    /// </summary>
    /// <param name="length">The number of moves to generate.</param>
    /// <param name="size">The cube size, which bounds the layers a move may turn.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when the length is not positive or the size is below <see cref="Cube.MinSize"/>.
    /// </exception>
    public MoveSequence Generate(int length, int size = 3)
    {
        if (length < 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(length), length, "Scramble length must be at least 1.");
        }

        if (size < Cube.MinSize)
        {
            throw new ArgumentOutOfRangeException(
                nameof(size), size, $"Cube size must be at least {Cube.MinSize}.");
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
            var direction = Directions[_random.Next(Directions.Length)];
            var layer = _random.Next(1, size);
            moves.Add(new Move(face, direction, layer));
        }

        return MoveSequence.Of(moves);
    }
}
