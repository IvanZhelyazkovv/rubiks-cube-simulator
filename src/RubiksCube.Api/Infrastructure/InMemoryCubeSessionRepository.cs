using System.Collections.Concurrent;

using RubiksCube.Application.Sessions;

namespace RubiksCube.Api.Infrastructure;

/// <summary>
/// Thread-safe in-memory implementation of the session store. Sessions are immutable
/// records, so atomic updates reduce to compare-and-swap on the dictionary entry.
/// </summary>
/// <remarks>
/// This adapter lives in the API project on purpose: it is the composition root's
/// only piece of infrastructure, and a dedicated Infrastructure project holding a
/// single dictionary would be structure without substance. Extracting one becomes
/// worthwhile the moment real persistence appears.
/// </remarks>
public sealed class InMemoryCubeSessionRepository : ICubeSessionRepository
{
    private readonly ConcurrentDictionary<Guid, CubeSession> _sessions = new();

    /// <inheritdoc />
    public CubeSession Get(Guid id) =>
        _sessions.TryGetValue(id, out var session)
            ? session
            : throw new CubeSessionNotFoundException(id);

    /// <inheritdoc />
    public void Add(CubeSession session)
    {
        ArgumentNullException.ThrowIfNull(session);

        if (!_sessions.TryAdd(session.Id, session))
        {
            throw new InvalidOperationException($"A session with id '{session.Id}' already exists.");
        }
    }

    /// <inheritdoc />
    public CubeSession Update(Guid id, Func<CubeSession, CubeSession> update)
    {
        ArgumentNullException.ThrowIfNull(update);

        while (true)
        {
            if (!_sessions.TryGetValue(id, out var current))
            {
                throw new CubeSessionNotFoundException(id);
            }

            var updated = update(current);
            if (_sessions.TryUpdate(id, updated, current))
            {
                return updated;
            }

            // Another request changed the session between read and write; retry on
            // the fresh value so neither update is lost.
        }
    }

    /// <inheritdoc />
    public bool Delete(Guid id) => _sessions.TryRemove(id, out _);
}
