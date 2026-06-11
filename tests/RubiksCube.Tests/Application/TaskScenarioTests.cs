using RubiksCube.Application.Rendering;
using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Application;

/// <summary>
/// The acceptance scenario from the task description: starting from a solved cube
/// (green front, red right, white up), apply F R' U B' L D' and verify every
/// sticker of the resulting exploded view. The expected layout was transcribed from
/// the task sheet, so it is fully independent of this code base.
/// </summary>
public sealed class TaskScenarioTests
{
    [Fact]
    public void TaskSequence_ProducesTheExpectedExplodedView()
    {
        var cube = Cube.CreateSolved(3).Apply(MoveSequence.Parse("F R' U B' L D'"));

        var expected = string.Join(
            Environment.NewLine,
            "       R O G",
            "       B W W",
            "       B B B",
            "G Y Y  O R R  Y B O  Y B W",
            "O O G  O G W  R R W  O B Y",
            "B G O  W W W  O Y R  Y Y W",
            "       G G B",
            "       R Y R",
            "       R G G",
            string.Empty);

        Assert.Equal(expected, CubeNetRenderer.Render(cube));
    }

    [Fact]
    public void TaskSequence_KeepsAllCentersInPlace()
    {
        var cube = Cube.CreateSolved(3).Apply(MoveSequence.Parse("F R' U B' L D'"));

        foreach (var face in Enum.GetValues<Face>())
        {
            Assert.Equal(ColorScheme.Standard.ColorOf(face), cube[face, 1, 1]);
        }
    }
}
