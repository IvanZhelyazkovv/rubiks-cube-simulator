using RubiksCube.Application.Dtos;
using RubiksCube.Application.Sessions;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Application.UseCases;

/// <summary>
/// Applies a sequence of moves, given in Singmaster notation, to a session's cube.
/// </summary>
/// <param name="repository">The session store.</param>
public sealed class ApplyMovesUseCase(ICubeSessionRepository repository)
{
    /// <summary>Parses <paramref name="notation"/> and applies the moves to the session.</summary>
    /// <param name="id">The session identifier.</param>
    /// <param name="notation">The moves to apply, e.g. <c>"F R' U2"</c>.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    /// <exception cref="InvalidMoveNotationException">Thrown when the notation is invalid.</exception>
    public CubeStateDto Execute(Guid id, string notation)
    {
        ArgumentNullException.ThrowIfNull(notation);

        var moves = MoveSequence.Parse(notation);
        var session = repository.Update(id, current => current.Apply([.. moves]));

        return CubeStateMapper.ToDto(session);
    }
}
