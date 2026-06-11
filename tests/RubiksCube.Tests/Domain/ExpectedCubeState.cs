using RubiksCube.Domain;

namespace RubiksCube.Tests.Domain;

/// <summary>
/// Test helper that builds an expected sticker layout — starting from a solved cube
/// and overriding individual rows or columns — and asserts a <see cref="Cube"/>
/// matches it sticker by sticker.
/// </summary>
internal sealed class ExpectedCubeState
{
    private static readonly Face[] Faces = Enum.GetValues<Face>();

    private readonly int _size;
    private readonly Dictionary<Face, CubeColor[,]> _faces = [];

    public ExpectedCubeState(int size, ColorScheme? scheme = null)
    {
        scheme ??= ColorScheme.Standard;
        _size = size;

        foreach (var face in Faces)
        {
            var grid = new CubeColor[size, size];
            for (var row = 0; row < size; row++)
            {
                for (var column = 0; column < size; column++)
                {
                    grid[row, column] = scheme.ColorOf(face);
                }
            }

            _faces[face] = grid;
        }
    }

    public ExpectedCubeState WithRow(Face face, int row, CubeColor color)
    {
        for (var column = 0; column < _size; column++)
        {
            _faces[face][row, column] = color;
        }

        return this;
    }

    public ExpectedCubeState WithColumn(Face face, int column, CubeColor color)
    {
        for (var row = 0; row < _size; row++)
        {
            _faces[face][row, column] = color;
        }

        return this;
    }

    public void AssertMatches(Cube cube)
    {
        Assert.Equal(_size, cube.Size);

        foreach (var face in Faces)
        {
            for (var row = 0; row < _size; row++)
            {
                for (var column = 0; column < _size; column++)
                {
                    var expected = _faces[face][row, column];
                    var actual = cube[face, row, column];

                    Assert.True(
                        expected == actual,
                        $"Sticker mismatch on {face} at ({row},{column}): expected {expected}, got {actual}.");
                }
            }
        }
    }
}
