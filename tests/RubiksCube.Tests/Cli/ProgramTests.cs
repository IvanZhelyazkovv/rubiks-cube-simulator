using CliProgram = RubiksCube.Cli.Program;

namespace RubiksCube.Tests.Cli;

/// <summary>
/// End-to-end tests of the console entry point, with output captured through a
/// redirected writer.
/// </summary>
[Collection(nameof(ConsoleSequentialCollection))]
public sealed class ProgramTests : IDisposable
{
    private readonly StringWriter _output = new();
    private readonly StringWriter _errorOutput = new();
    private readonly TextWriter _originalOutput = Console.Out;
    private readonly TextWriter _originalError = Console.Error;

    public ProgramTests()
    {
        Console.SetOut(_output);
        Console.SetError(_errorOutput);
    }

    public void Dispose()
    {
        Console.SetOut(_originalOutput);
        Console.SetError(_originalError);
        _output.Dispose();
        _errorOutput.Dispose();
    }

    [Fact]
    public void Main_WithoutArguments_PrintsTheTaskScenario()
    {
        var exitCode = CliProgram.Main([]);

        var output = _output.ToString();
        Assert.Equal(0, exitCode);
        Assert.Contains("Moves applied: F R' U B' L D'", output);

        // The solved starting position.
        Assert.Contains("O O O  G G G  R R R  B B B", output);

        // The exact expected result of the task sequence, row by row.
        Assert.Contains("       R O G", output);
        Assert.Contains("       B W W", output);
        Assert.Contains("       B B B", output);
        Assert.Contains("G Y Y  O R R  Y B O  Y B W", output);
        Assert.Contains("O O G  O G W  R R W  O B Y", output);
        Assert.Contains("B G O  W W W  O Y R  Y Y W", output);
        Assert.Contains("       G G B", output);
        Assert.Contains("       R Y R", output);
        Assert.Contains("       R G G", output);
    }

    [Fact]
    public void Main_WithCustomMoves_AppliesThem()
    {
        var exitCode = CliProgram.Main(["F", "F'"]);

        var output = _output.ToString();
        Assert.Equal(0, exitCode);
        Assert.Contains("Moves applied: F F'", output);

        // F followed by its inverse leaves the cube solved.
        Assert.Contains("       Y Y Y", output);
    }

    [Fact]
    public void Main_WithCustomSize_SimulatesThatSize()
    {
        var exitCode = CliProgram.Main(["--size", "4"]);

        Assert.Equal(0, exitCode);
        Assert.Contains("4x4x4", _output.ToString());
    }

    [Theory]
    [InlineData("X")]
    [InlineData("F3")]
    public void Main_WithInvalidNotation_FailsWithExplanation(string notation)
    {
        var exitCode = CliProgram.Main([notation]);

        Assert.Equal(1, exitCode);
        Assert.Contains("Invalid move notation", _errorOutput.ToString());
    }

    [Theory]
    [InlineData("--size")]
    [InlineData("--size", "abc")]
    [InlineData("--size", "1")]
    [InlineData("--size", "11")]
    [InlineData("--unknown")]
    public void Main_WithInvalidArguments_FailsWithUsage(params string[] args)
    {
        var exitCode = CliProgram.Main(args);

        Assert.Equal(1, exitCode);
        Assert.Contains("Usage:", _errorOutput.ToString());
    }
}
