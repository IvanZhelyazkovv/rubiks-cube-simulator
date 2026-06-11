using RubiksCube.Application.Dtos;
using RubiksCube.Application.Sessions;
using RubiksCube.Domain;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Creates a new session holding a solved cube.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class CreateCubeUseCase(ICubeSessionRepository repository)
{
    /// <summary>
    /// The largest cube size a session may hold. The domain model supports any size;
    /// this is a service policy that keeps payloads and rendering sensible — and it is
    /// shared by every entry point (the API and the console runner).
    /// </summary>
    public const int MaxSize = 10;

    /// <summary>The size used when the caller does not specify one — the classic cube.</summary>
    public const int DefaultSize = 3;

    /// <summary>Creates a session with a solved cube of the given <paramref name="size"/>.</summary>
    /// <param name="size">The cube size; 3 is the classic cube.</param>
    /// <exception cref="InvalidCubeSizeException">
    /// Thrown when the size is outside [<see cref="Cube.MinSize"/>, <see cref="MaxSize"/>].
    /// </exception>
    public CubeStateDto Execute(int size = DefaultSize)
    {
        if (size is < Cube.MinSize or > MaxSize)
        {
            throw new InvalidCubeSizeException(size, Cube.MinSize, MaxSize);
        }

        var session = CubeSession.CreateNew(size);
        repository.Add(session);

        return CubeStateMapper.ToDto(session);
    }
}
