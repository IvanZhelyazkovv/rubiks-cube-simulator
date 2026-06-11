using RubiksCube.Domain.Geometry;

namespace RubiksCube.Domain;

/// <summary>
/// An assignment of a distinct colour to each face of a solved cube.
/// </summary>
public sealed class ColorScheme
{
    private readonly IReadOnlyDictionary<Face, CubeColor> _colors;

    private ColorScheme(IReadOnlyDictionary<Face, CubeColor> colors)
    {
        _colors = colors;
    }

    /// <summary>
    /// The standard Western colour scheme oriented as on rubiks-cube-solver.com:
    /// green at the front, red on the right and white on top
    /// (and therefore blue at the back, orange on the left and yellow at the bottom).
    /// </summary>
    public static ColorScheme Standard { get; } = Create(
        up: CubeColor.White,
        down: CubeColor.Yellow,
        front: CubeColor.Green,
        back: CubeColor.Blue,
        left: CubeColor.Orange,
        right: CubeColor.Red);

    /// <summary>
    /// Creates a colour scheme from one colour per face.
    /// </summary>
    /// <param name="up">The colour of the up face.</param>
    /// <param name="down">The colour of the down face.</param>
    /// <param name="front">The colour of the front face.</param>
    /// <param name="back">The colour of the back face.</param>
    /// <param name="left">The colour of the left face.</param>
    /// <param name="right">The colour of the right face.</param>
    /// <exception cref="ArgumentException">Thrown when the six colours are not all distinct.</exception>
    public static ColorScheme Create(
        CubeColor up,
        CubeColor down,
        CubeColor front,
        CubeColor back,
        CubeColor left,
        CubeColor right)
    {
        var colors = new Dictionary<Face, CubeColor>
        {
            [Face.Up] = up,
            [Face.Down] = down,
            [Face.Front] = front,
            [Face.Back] = back,
            [Face.Left] = left,
            [Face.Right] = right,
        };

        if (colors.Values.Distinct().Count() != colors.Count)
        {
            throw new ArgumentException("Each face of a colour scheme must have a distinct colour.");
        }

        return new ColorScheme(colors);
    }

    /// <summary>Returns the colour of the given <paramref name="face"/> on a solved cube.</summary>
    /// <param name="face">The face whose colour to look up.</param>
    public CubeColor ColorOf(Face face)
    {
        if (!_colors.TryGetValue(face, out var color))
        {
            throw new ArgumentOutOfRangeException(nameof(face), face, "Unknown face.");
        }

        return color;
    }

    /// <summary>Returns the face that carries the given <paramref name="color"/> on a solved cube.</summary>
    /// <param name="color">The colour whose face to look up.</param>
    public Face FaceOf(CubeColor color)
    {
        foreach (var face in FaceOrientation.AllFaces)
        {
            if (_colors[face] == color)
            {
                return face;
            }
        }

        throw new ArgumentOutOfRangeException(nameof(color), color, "Colour is not part of this scheme.");
    }
}
