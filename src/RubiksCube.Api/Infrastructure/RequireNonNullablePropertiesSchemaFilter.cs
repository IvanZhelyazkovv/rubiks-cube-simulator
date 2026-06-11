using Microsoft.OpenApi;

using Swashbuckle.AspNetCore.SwaggerGen;

namespace RubiksCube.Api.Infrastructure;

/// <summary>
/// Marks every non-nullable property as required in the OpenAPI document.
/// Together with <c>SupportNonNullableReferenceTypes</c> this makes the published
/// contract as strict as the C# DTOs, so generated clients get non-optional types.
/// </summary>
public sealed class RequireNonNullablePropertiesSchemaFilter : ISchemaFilter
{
    /// <inheritdoc />
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema concrete || concrete.Properties is null)
        {
            return;
        }

        foreach (var (name, property) in concrete.Properties)
        {
            var nullable = property.Type?.HasFlag(JsonSchemaType.Null) ?? false;
            if (!nullable)
            {
                concrete.Required ??= new HashSet<string>();
                concrete.Required.Add(name);
            }
        }
    }
}
