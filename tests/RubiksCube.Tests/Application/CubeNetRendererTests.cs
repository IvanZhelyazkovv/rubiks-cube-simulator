using RubiksCube.Application.Rendering;
using RubiksCube.Domain;

namespace RubiksCube.Tests.Application;

public sealed class CubeNetRendererTests
{
    [Fact]
    public void Render_SolvedThreeByThree_ProducesTheStandardNet()
    {
        var expected = string.Join(
            Environment.NewLine,
            "       W W W",
            "       W W W",
            "       W W W",
            "O O O  G G G  R R R  B B B",
            "O O O  G G G  R R R  B B B",
            "O O O  G G G  R R R  B B B",
            "       Y Y Y",
            "       Y Y Y",
            "       Y Y Y",
            string.Empty);

        Assert.Equal(expected, CubeNetRenderer.Render(Cube.CreateSolved(3)));
    }

    [Fact]
    public void Render_SolvedTwoByTwo_ScalesTheLayoutToTheCubeSize()
    {
        var expected = string.Join(
            Environment.NewLine,
            "     W W",
            "     W W",
            "O O  G G  R R  B B",
            "O O  G G  R R  B B",
            "     Y Y",
            "     Y Y",
            string.Empty);

        Assert.Equal(expected, CubeNetRenderer.Render(Cube.CreateSolved(2)));
    }

    [Fact]
    public void Render_RejectsNullCube()
    {
        Assert.Throws<ArgumentNullException>(() => CubeNetRenderer.Render(null!));
    }
}
