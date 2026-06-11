using System.Text;

using RubiksCube.Domain;

namespace RubiksCube.Application.Rendering;

/// <summary>
/// Renders a cube as the standard exploded view (an unfolded cross):
/// the up face on top; the left, front, right and back faces side by side;
/// the down face at the bottom. Each sticker is shown as its colour letter.
/// </summary>
/// <example>
/// A solved 3×3 cube renders as:
/// <code>
///        W W W
///        W W W
///        W W W
/// O O O  G G G  R R R  B B B
/// O O O  G G G  R R R  B B B
/// O O O  G G G  R R R  B B B
///        Y Y Y
///        Y Y Y
///        Y Y Y
/// </code>
/// </example>
public static class CubeNetRenderer
{
    private const string FaceGutter = "  ";

    /// <summary>Renders the exploded view of the given <paramref name="cube"/>.</summary>
    /// <param name="cube">The cube to render.</param>
    public static string Render(Cube cube)
    {
        ArgumentNullException.ThrowIfNull(cube);

        var builder = new StringBuilder();

        // One face row, e.g. "W W W", is 2N - 1 characters wide; the up and down
        // blocks sit above and below the front face, i.e. one face width plus
        // one gutter to the right of the left edge.
        var indent = new string(' ', (2 * cube.Size) - 1 + FaceGutter.Length);

        for (var row = 0; row < cube.Size; row++)
        {
            builder.Append(indent);
            builder.AppendLine(FaceRow(cube, Face.Up, row));
        }

        for (var row = 0; row < cube.Size; row++)
        {
            builder.AppendLine(string.Join(
                FaceGutter,
                FaceRow(cube, Face.Left, row),
                FaceRow(cube, Face.Front, row),
                FaceRow(cube, Face.Right, row),
                FaceRow(cube, Face.Back, row)));
        }

        for (var row = 0; row < cube.Size; row++)
        {
            builder.Append(indent);
            builder.AppendLine(FaceRow(cube, Face.Down, row));
        }

        return builder.ToString();
    }

    private static string FaceRow(Cube cube, Face face, int row)
    {
        var letters = new char[cube.Size];
        for (var column = 0; column < cube.Size; column++)
        {
            letters[column] = CubeColorFormatter.ToLetter(cube[face, row, column]);
        }

        return string.Join(' ', letters);
    }
}
