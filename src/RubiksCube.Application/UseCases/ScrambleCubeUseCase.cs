using RubiksCube.Application.Dtos;
using RubiksCube.Application.Scrambling;
using RubiksCube.Application.Sessions;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Applies a randomly generated scramble to a session's cube.
/// </summary>
/// <param name="repository">The session store.</param>
/// <param name="scrambleGenerator">The source of random scrambles.</param>
public sealed class ScrambleCubeUseCase(
    ICubeSessionRepository repository,
    ScrambleGenerator scrambleGenerator)
{
    /// <summary>The scramble length used when the caller does not specify one.</summary>
    public const int DefaultLength = 25;

    /// <summary>The largest accepted scramble length.</summary>
    public const int MaxLength = 200;

    /// <summary>Scrambles the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <param name="length">The number of random moves; <see cref="DefaultLength"/> when omitted.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when the length is outside [1, <see cref="MaxLength"/>].
    /// </exception>
    public CubeStateDto Execute(Guid id, int? length = null)
    {
        var moveCount = length ?? DefaultLength;
        if (moveCount is < 1 or > MaxLength)
        {
            throw new ArgumentOutOfRangeException(
                nameof(length), moveCount, $"Scramble length must be between 1 and {MaxLength}.");
        }

        var scramble = scrambleGenerator.Generate(moveCount);
        var session = repository.Update(id, current => current.Apply([.. scramble]));

        return CubeStateMapper.ToDto(session);
    }
}
