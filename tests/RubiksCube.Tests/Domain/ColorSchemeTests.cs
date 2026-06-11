using RubiksCube.Domain;

namespace RubiksCube.Tests.Domain;

public sealed class ColorSchemeTests
{
    [Fact]
    public void Standard_MatchesTheTaskOrientation()
    {
        // Green at the front, red on the right, white on top —
        // the rubiks-cube-solver.com starting orientation required by the task.
        var scheme = ColorScheme.Standard;

        Assert.Equal(CubeColor.Green, scheme.ColorOf(Face.Front));
        Assert.Equal(CubeColor.Red, scheme.ColorOf(Face.Right));
        Assert.Equal(CubeColor.White, scheme.ColorOf(Face.Up));
        Assert.Equal(CubeColor.Blue, scheme.ColorOf(Face.Back));
        Assert.Equal(CubeColor.Orange, scheme.ColorOf(Face.Left));
        Assert.Equal(CubeColor.Yellow, scheme.ColorOf(Face.Down));
    }

    [Fact]
    public void FaceOf_IsTheInverseOfColorOf()
    {
        var scheme = ColorScheme.Standard;

        foreach (var face in Enum.GetValues<Face>())
        {
            Assert.Equal(face, scheme.FaceOf(scheme.ColorOf(face)));
        }
    }

    [Fact]
    public void Create_RejectsDuplicateColors()
    {
        Assert.Throws<ArgumentException>(() => ColorScheme.Create(
            up: CubeColor.White,
            down: CubeColor.White,
            front: CubeColor.Green,
            back: CubeColor.Blue,
            left: CubeColor.Orange,
            right: CubeColor.Red));
    }
}
