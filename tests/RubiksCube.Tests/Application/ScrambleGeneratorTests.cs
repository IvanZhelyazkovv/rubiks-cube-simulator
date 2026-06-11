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
        var scramble = new ScrambleGenerator(seed: 42).Generate(500, size: 4);

        for (var i = 1; i < scramble.Count; i++)
        {
            Assert.NotEqual(scramble[i - 1].Face, scramble[i].Face);
        }
    }

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(5)]
    public void Generate_OnlyUsesLayersTheCubeHas(int size)
    {
        var scramble = new ScrambleGenerator(seed: 42).Generate(500, size);

        Assert.All(scramble, move => Assert.InRange(move.Layer, 1, size - 1));
    }

    [Fact]
    public void Generate_UsesInnerSlicesOnBiggerCubes()
    {
        // A face-turn-only scramble can never move the inner centre stickers
        // of a 4×4, so slices must take part.
        var scramble = new ScrambleGenerator(seed: 42).Generate(100, size: 4);

        Assert.Contains(scramble, move => move.Layer > 1);
    }

    [Fact]
    public void Generate_IsDeterministicForAGivenSeed()
    {
        var first = new ScrambleGenerator(seed: 7).Generate(30, size: 5);
        var second = new ScrambleGenerator(seed: 7).Generate(30, size: 5);

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

    [Fact]
    public void Generate_RejectsSizesBelowTheSmallestCube()
    {
        var generator = new ScrambleGenerator(seed: 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => generator.Generate(10, size: 1));
    }
}
