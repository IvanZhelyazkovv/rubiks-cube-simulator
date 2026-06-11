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
    /// <summary>Maps the given <paramref name="session"/> to a <see cref="CubeStateDto"/>.</summary>
    /// <param name="session">The session to map.</param>
    public static CubeStateDto ToDto(CubeSession session)
    {
        ArgumentNullException.ThrowIfNull(session);

        var cube = session.Cube;
        var faces = new CubeFacesDto(
            Up: FaceRows(cube, Face.Up),
            Down: FaceRows(cube, Face.Down),
            Front: FaceRows(cube, Face.Front),
            Back: FaceRows(cube, Face.Back),
            Left: FaceRows(cube, Face.Left),
            Right: FaceRows(cube, Face.Right));

        return new CubeStateDto(
            session.Id,
            cube.Size,
            cube.IsSolved,
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
