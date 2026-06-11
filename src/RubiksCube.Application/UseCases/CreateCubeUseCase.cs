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
    /// this is a service policy that keeps payloads and rendering sensible.
    /// </summary>
    public const int MaxSize = 10;

    /// <summary>Creates a session with a solved cube of the given <paramref name="size"/>.</summary>
    /// <param name="size">The cube size; 3 is the classic cube.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when the size is outside [<see cref="Cube.MinSize"/>, <see cref="MaxSize"/>].
    /// </exception>
    public CubeStateDto Execute(int size = 3)
    {
        if (size is < Cube.MinSize or > MaxSize)
        {
            throw new ArgumentOutOfRangeException(
                nameof(size), size, $"Cube size must be between {Cube.MinSize} and {MaxSize}.");
        }

        var session = CubeSession.CreateNew(size);
        repository.Add(session);

        return CubeStateMapper.ToDto(session);
    }
}
