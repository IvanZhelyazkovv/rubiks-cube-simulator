using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

using RubiksCube.Application.Sessions;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Api.Infrastructure;

/// <summary>
/// Translates the application's domain exceptions into RFC 9457 problem-details
/// responses with appropriate status codes, keeping controllers free of
/// error-mapping boilerplate.
/// </summary>
public sealed class DomainExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    /// <inheritdoc />
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        (int Status, string Title)? mapping = exception switch
        {
            CubeSessionNotFoundException => (StatusCodes.Status404NotFound, "Cube not found"),
            InvalidMoveNotationException => (StatusCodes.Status400BadRequest, "Invalid move notation"),
            EmptyMoveHistoryException => (StatusCodes.Status409Conflict, "Nothing to undo"),
            ArgumentOutOfRangeException => (StatusCodes.Status400BadRequest, "Invalid argument"),
            _ => null,
        };

        if (mapping is not { } problem)
        {
            return false;
        }

        httpContext.Response.StatusCode = problem.Status;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = problem.Status,
                Title = problem.Title,
                Detail = exception.Message,
            },
        });
    }
}
