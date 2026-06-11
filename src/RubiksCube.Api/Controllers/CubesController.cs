using Microsoft.AspNetCore.Mvc;

using RubiksCube.Api.Contracts;
using RubiksCube.Application.Dtos;
using RubiksCube.Application.UseCases;

namespace RubiksCube.Api.Controllers;

/// <summary>
/// CRUD-style endpoints for cube sessions: create a cube, rotate its faces,
/// scramble, undo, reset and inspect its state.
/// </summary>
[ApiController]
[Route("api/cubes")]
[Produces("application/json")]
public sealed class CubesController(
    CreateCubeUseCase createCube,
    GetCubeUseCase getCube,
    ApplyMovesUseCase applyMoves,
    UndoLastMoveUseCase undoLastMove,
    ResetCubeUseCase resetCube,
    ScrambleCubeUseCase scrambleCube,
    DeleteCubeUseCase deleteCube) : ControllerBase
{
    /// <summary>Creates a new solved cube and returns its state.</summary>
    /// <param name="request">Optional settings; defaults to a 3×3 cube.</param>
    [HttpPost]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public ActionResult<CubeStateDto> Create([FromBody] CreateCubeRequest? request)
    {
        var cube = createCube.Execute(request?.Size ?? 3);
        return CreatedAtAction(nameof(Get), new { id = cube.Id }, cube);
    }

    /// <summary>Returns the current state of a cube.</summary>
    /// <param name="id">The cube session id.</param>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<CubeStateDto> Get(Guid id) => getCube.Execute(id);

    /// <summary>Applies moves in Singmaster notation (e.g. <c>"F R' U2"</c>) to a cube.</summary>
    /// <param name="id">The cube session id.</param>
    /// <param name="request">The moves to apply.</param>
    [HttpPost("{id:guid}/moves")]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<CubeStateDto> ApplyMoves(Guid id, [FromBody] ApplyMovesRequest request) =>
        applyMoves.Execute(id, request.Moves);

    /// <summary>Undoes the most recently applied move.</summary>
    /// <param name="id">The cube session id.</param>
    [HttpPost("{id:guid}/undo")]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public ActionResult<CubeStateDto> Undo(Guid id) => undoLastMove.Execute(id);

    /// <summary>Restores the cube to its solved state and clears the move history.</summary>
    /// <param name="id">The cube session id.</param>
    [HttpPost("{id:guid}/reset")]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<CubeStateDto> Reset(Guid id) => resetCube.Execute(id);

    /// <summary>Applies a random scramble to the cube.</summary>
    /// <param name="id">The cube session id.</param>
    /// <param name="request">Optional scramble settings.</param>
    [HttpPost("{id:guid}/scramble")]
    [ProducesResponseType<CubeStateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<CubeStateDto> Scramble(Guid id, [FromBody] ScrambleRequest? request) =>
        scrambleCube.Execute(id, request?.Length);

    /// <summary>Deletes a cube session.</summary>
    /// <param name="id">The cube session id.</param>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public IActionResult Delete(Guid id)
    {
        deleteCube.Execute(id);
        return NoContent();
    }
}
