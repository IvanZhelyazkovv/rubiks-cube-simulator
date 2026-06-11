using RubiksCube.Application.Dtos;
using RubiksCube.Application.Sessions;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Reads the current state of a session.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class GetCubeUseCase(ICubeSessionRepository repository)
{
    /// <summary>Returns the current state of the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    public CubeStateDto Execute(Guid id) => CubeStateMapper.ToDto(repository.Get(id));
}
