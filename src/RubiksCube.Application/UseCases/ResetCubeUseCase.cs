using RubiksCube.Application.Dtos;
using RubiksCube.Application.Sessions;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Restores a session to a solved cube and clears its history.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class ResetCubeUseCase(ICubeSessionRepository repository)
{
    /// <summary>Resets the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    public CubeStateDto Execute(Guid id) =>
        CubeStateMapper.ToDto(repository.Update(id, session => session.Reset()));
}
