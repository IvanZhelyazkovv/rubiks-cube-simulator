using RubiksCube.Api.Infrastructure;
using RubiksCube.Application.Scrambling;
using RubiksCube.Application.Sessions;
using RubiksCube.Application.UseCases;

namespace RubiksCube.Tests.Application;

/// <summary>
/// Application-level tests of the use cases composed with the real in-memory store.
/// </summary>
public sealed class CubeUseCasesTests
{
    private readonly InMemoryCubeSessionRepository _repository = new();

    [Fact]
    public void CreateCube_ReturnsASolvedCubeOfTheRequestedSize()
    {
        var cube = new CreateCubeUseCase(_repository).Execute(4);

        Assert.Equal(4, cube.Size);
        Assert.True(cube.IsSolved);
        Assert.Empty(cube.History);
        Assert.Equal(["WWWW", "WWWW", "WWWW", "WWWW"], cube.Faces.Up);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(11)]
    public void CreateCube_RejectsSizesOutsideThePolicyRange(int size)
    {
        var exception = Assert.Throws<InvalidCubeSizeException>(
            () => new CreateCubeUseCase(_repository).Execute(size));

        Assert.Equal(size, exception.Size);
    }

    [Fact]
    public void ApplyMoves_UpdatesStateAndHistory()
    {
        var created = new CreateCubeUseCase(_repository).Execute();

        var updated = new ApplyMovesUseCase(_repository).Execute(created.Id, "F R' U B' L D'");

        Assert.False(updated.IsSolved);
        Assert.Equal(["F", "R'", "U", "B'", "L", "D'"], updated.History);

        // The task scenario, face by face (rows from top to bottom).
        Assert.Equal(["ROG", "BWW", "BBB"], updated.Faces.Up);
        Assert.Equal(["ORR", "OGW", "WWW"], updated.Faces.Front);
        Assert.Equal(["YBO", "RRW", "OYR"], updated.Faces.Right);
        Assert.Equal(["YBW", "OBY", "YYW"], updated.Faces.Back);
        Assert.Equal(["GYY", "OOG", "BGO"], updated.Faces.Left);
        Assert.Equal(["GGB", "RYR", "RGG"], updated.Faces.Down);
    }

    [Fact]
    public void ApplyMoves_OnUnknownSession_Throws()
    {
        Assert.Throws<CubeSessionNotFoundException>(
            () => new ApplyMovesUseCase(_repository).Execute(Guid.NewGuid(), "F"));
    }

    [Fact]
    public void ApplyMoves_RejectsMoreMovesThanThePolicyAllows()
    {
        var created = new CreateCubeUseCase(_repository).Execute();
        var oversized = string.Join(' ', Enumerable.Repeat("F", ApplyMovesUseCase.MaxMovesPerRequest + 1));

        var exception = Assert.Throws<TooManyMovesException>(
            () => new ApplyMovesUseCase(_repository).Execute(created.Id, oversized));

        Assert.Equal(ApplyMovesUseCase.MaxMovesPerRequest + 1, exception.Count);

        // A rejected request must not partially apply.
        Assert.Empty(new GetCubeUseCase(_repository).Execute(created.Id).History);
    }

    [Fact]
    public void UndoLastMove_RestoresThePreviousState()
    {
        var created = new CreateCubeUseCase(_repository).Execute();
        new ApplyMovesUseCase(_repository).Execute(created.Id, "F");

        var undone = new UndoLastMoveUseCase(_repository).Execute(created.Id);

        Assert.True(undone.IsSolved);
        Assert.Empty(undone.History);
    }

    [Fact]
    public void ResetCube_ReturnsToSolvedAndClearsHistory()
    {
        var created = new CreateCubeUseCase(_repository).Execute();
        new ApplyMovesUseCase(_repository).Execute(created.Id, "F R' U");

        var reset = new ResetCubeUseCase(_repository).Execute(created.Id);

        Assert.True(reset.IsSolved);
        Assert.Empty(reset.History);
    }

    [Fact]
    public void ScrambleCube_AppliesTheRequestedNumberOfMoves()
    {
        var created = new CreateCubeUseCase(_repository).Execute();
        var useCase = new ScrambleCubeUseCase(_repository, new ScrambleGenerator(seed: 5));

        var scrambled = useCase.Execute(created.Id, 30);

        Assert.Equal(30, scrambled.History.Count);
    }

    [Fact]
    public void ScrambleCube_OnA4x4_DisturbsTheInnerCentres()
    {
        // Face turns alone can never move a 4×4's inner centre stickers; the
        // scramble must reach them through slice moves.
        var created = new CreateCubeUseCase(_repository).Execute(4);
        var useCase = new ScrambleCubeUseCase(_repository, new ScrambleGenerator(seed: 5));

        var scrambled = useCase.Execute(created.Id, 40);

        var innerCentres = new[]
        {
            scrambled.Faces.Up[1][1],
            scrambled.Faces.Up[1][2],
            scrambled.Faces.Up[2][1],
            scrambled.Faces.Up[2][2],
        };
        Assert.Contains(innerCentres, colour => colour != 'W');
    }

    [Theory]
    [InlineData(0)]
    [InlineData(201)]
    public void ScrambleCube_RejectsLengthsOutsideThePolicyRange(int length)
    {
        var created = new CreateCubeUseCase(_repository).Execute();
        var useCase = new ScrambleCubeUseCase(_repository, new ScrambleGenerator(seed: 5));

        Assert.Throws<InvalidScrambleLengthException>(() => useCase.Execute(created.Id, length));
    }

    [Fact]
    public void DeleteCube_RemovesTheSession()
    {
        var created = new CreateCubeUseCase(_repository).Execute();

        new DeleteCubeUseCase(_repository).Execute(created.Id);

        Assert.Throws<CubeSessionNotFoundException>(
            () => new GetCubeUseCase(_repository).Execute(created.Id));
    }

    [Fact]
    public void DeleteCube_OnUnknownSession_Throws()
    {
        Assert.Throws<CubeSessionNotFoundException>(
            () => new DeleteCubeUseCase(_repository).Execute(Guid.NewGuid()));
    }
}
