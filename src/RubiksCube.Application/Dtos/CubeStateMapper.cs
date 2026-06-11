using System.Text;

using RubiksCube.Application.Rendering;
using RubiksCube.Application.Sessions;
using RubiksCube.Domain;

namespace RubiksCube.Application.Dtos;

/// <summary>
/// Maps cube sessions to their client-facing representation.
/// </summary>
public static class CubeStateMapper
{
    private static readonly (Face Face, string Name)[] FaceNames =
    [
        (Face.Up, "up"),
        (Face.Down, "down"),
        (Face.Front, "front"),
        (Face.Back, "back"),
        (Face.Left, "left"),
        (Face.Right, "right"),
    ];

    /// <summary>Maps the given <paramref name="session"/> to a <see cref="CubeStateDto"/>.</summary>
    /// <param name="session">The session to map.</param>
    public static CubeStateDto ToDto(CubeSession session)
    {
        ArgumentNullException.ThrowIfNull(session);

        var faces = new Dictionary<string, IReadOnlyList<string>>();
        foreach (var (face, name) in FaceNames)
        {
            faces[name] = FaceRows(session.Cube, face);
        }

        return new CubeStateDto(
            session.Id,
            session.Cube.Size,
            session.Cube.IsSolved,
            faces,
            [.. session.History.Select(move => move.ToString())]);
    }

    private static List<string> FaceRows(Cube cube, Face face)
    {
        var rows = new List<string>(cube.Size);
        for (var row = 0; row < cube.Size; row++)
        {
            var letters = new StringBuilder(cube.Size);
            for (var column = 0; column < cube.Size; column++)
            {
                letters.Append(CubeColorFormatter.ToLetter(cube[face, row, column]));
            }

            rows.Add(letters.ToString());
        }

        return rows;
    }
}
