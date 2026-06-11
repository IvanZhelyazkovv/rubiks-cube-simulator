using RubiksCube.Application.Sessions;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Removes a session from the store.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class DeleteCubeUseCase(ICubeSessionRepository repository)
{
    /// <summary>Deletes the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    public void Execute(Guid id)
    {
        if (!repository.Delete(id))
        {
            throw new CubeSessionNotFoundException(id);
        }
    }
}
