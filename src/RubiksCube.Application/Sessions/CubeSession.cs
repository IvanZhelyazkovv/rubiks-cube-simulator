using System.Collections.Immutable;

using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Application.Sessions;

/// <summary>
/// A cube being manipulated by a client, identified by id, together with the
/// full history of moves applied since it was created or last reset.
/// Like the cube itself, a session is immutable: every operation returns a new session.
/// </summary>
/// <param name="Id">The session's unique identifier.</param>
/// <param name="Cube">The current cube state.</param>
/// <param name="History">Every move applied since creation or the last reset, in order.</param>
public sealed record CubeSession(Guid Id, Cube Cube, ImmutableList<Move> History)
{
    /// <summary>Creates a session holding a solved cube of the given <paramref name="size"/>.</summary>
    /// <param name="size">The cube size, e.g. 3 for the classic cube.</param>
    public static CubeSession CreateNew(int size) =>
        new(Guid.NewGuid(), Cube.CreateSolved(size), []);

    /// <summary>Returns the session with the given <paramref name="moves"/> applied and recorded.</summary>
    /// <param name="moves">The moves to apply, in order.</param>
    public CubeSession Apply(IReadOnlyList<Move> moves) => this with
    {
        Cube = Cube.Apply(moves),
        History = History.AddRange(moves),
    };

    /// <summary>Returns the session restored to a solved cube with an empty history.</summary>
    public CubeSession Reset() => this with
    {
        Cube = Domain.Cube.CreateSolved(Cube.Size),
        History = [],
    };

    /// <summary>
    /// Returns the session with the most recent move undone — its inverse is applied
    /// to the cube and the move is removed from the history.
    /// </summary>
    /// <exception cref="EmptyMoveHistoryException">Thrown when there is nothing to undo.</exception>
    public CubeSession UndoLastMove()
    {
        if (History.IsEmpty)
        {
            throw new EmptyMoveHistoryException(Id);
        }

        var lastMove = History[^1];
        return this with
        {
            Cube = Cube.Apply(lastMove.Inverse),
            History = History.RemoveAt(History.Count - 1),
        };
    }
}
