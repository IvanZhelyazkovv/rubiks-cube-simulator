using RubiksCube.Application.Sessions;
using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Application;

public sealed class CubeSessionTests
{
    [Fact]
    public void CreateNew_StartsSolvedWithEmptyHistory()
    {
        var session = CubeSession.CreateNew(3);

        Assert.True(session.Cube.IsSolved);
        Assert.Empty(session.History);
        Assert.NotEqual(Guid.Empty, session.Id);
    }

    [Fact]
    public void Apply_RecordsMovesInOrderAndKeepsTheOriginalUntouched()
    {
        var original = CubeSession.CreateNew(3);
        var moves = MoveSequence.Parse("F R'");

        var applied = original.Apply([.. moves]);

        Assert.Equal(["F", "R'"], applied.History.Select(move => move.ToString()));
        Assert.Equal(original.Id, applied.Id);
        Assert.Empty(original.History);
        Assert.True(original.Cube.IsSolved);
    }

    [Fact]
    public void UndoLastMove_RevertsTheCubeAndShrinksTheHistory()
    {
        var session = CubeSession.CreateNew(3).Apply([.. MoveSequence.Parse("F R'")]);

        var undone = session.UndoLastMove();

        Assert.Equal(["F"], undone.History.Select(move => move.ToString()));
        Assert.Equal(
            Cube.CreateSolved(3).Apply(new Move(Face.Front, RotationDirection.Clockwise)),
            undone.Cube);
    }

    [Fact]
    public void UndoLastMove_OnEmptyHistory_Throws()
    {
        var session = CubeSession.CreateNew(3);

        var exception = Assert.Throws<EmptyMoveHistoryException>(() => session.UndoLastMove());
        Assert.Equal(session.Id, exception.Id);
    }

    [Fact]
    public void Reset_RestoresASolvedCubeAndClearsHistory()
    {
        var session = CubeSession.CreateNew(4).Apply([.. MoveSequence.Parse("F R' U2 B")]);

        var reset = session.Reset();

        Assert.True(reset.Cube.IsSolved);
        Assert.Empty(reset.History);
        Assert.Equal(4, reset.Cube.Size);
        Assert.Equal(session.Id, reset.Id);
    }
}
