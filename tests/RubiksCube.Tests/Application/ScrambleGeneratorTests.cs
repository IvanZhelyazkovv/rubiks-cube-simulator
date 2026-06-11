using RubiksCube.Application.Scrambling;

namespace RubiksCube.Tests.Application;

public sealed class ScrambleGeneratorTests
{
    [Fact]
    public void Generate_ProducesTheRequestedNumberOfMoves()
    {
        var scramble = new ScrambleGenerator(seed: 42).Generate(25);

        Assert.Equal(25, scramble.Count);
    }

    [Fact]
    public void Generate_NeverUsesTheSameFaceTwiceInARow()
    {
        var scramble = new ScrambleGenerator(seed: 42).Generate(500);

        for (var i = 1; i < scramble.Count; i++)
        {
            Assert.NotEqual(scramble[i - 1].Face, scramble[i].Face);
        }
    }

    [Fact]
    public void Generate_IsDeterministicForAGivenSeed()
    {
        var first = new ScrambleGenerator(seed: 7).Generate(30);
        var second = new ScrambleGenerator(seed: 7).Generate(30);

        Assert.Equal(first.ToString(), second.ToString());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Generate_RejectsNonPositiveLengths(int length)
    {
        var generator = new ScrambleGenerator(seed: 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => generator.Generate(length));
    }
}
