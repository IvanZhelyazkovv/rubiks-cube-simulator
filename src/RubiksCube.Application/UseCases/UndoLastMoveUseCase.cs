using RubiksCube.Application.Dtos;
using RubiksCube.Application.Sessions;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Undoes the most recent move of a session by applying its inverse.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class UndoLastMoveUseCase(ICubeSessionRepository repository)
{
    /// <summary>Undoes the most recent move of the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    /// <exception cref="EmptyMoveHistoryException">Thrown when the history is empty.</exception>
    public CubeStateDto Execute(Guid id) =>
        CubeStateMapper.ToDto(repository.Update(id, session => session.UndoLastMove()));
}
