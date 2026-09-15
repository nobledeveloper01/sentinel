# Sentinel API.
#
# Multi-stage: the SDK builds, and only the runtime ships. The published image
# carries no compiler, no source and no NuGet cache.

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore before copying the rest, so a source-only change does not re-download
# every package. Central package management means the two .props files are part
# of the restore graph and have to come along.
COPY Directory.Build.props Directory.Packages.props Sentinel.sln ./
COPY src/Sentinel.Domain/Sentinel.Domain.csproj src/Sentinel.Domain/
COPY src/Sentinel.Infrastructure/Sentinel.Infrastructure.csproj src/Sentinel.Infrastructure/
COPY src/Sentinel.Api/Sentinel.Api.csproj src/Sentinel.Api/
COPY tests/Sentinel.Domain.Tests/Sentinel.Domain.Tests.csproj tests/Sentinel.Domain.Tests/
COPY tests/Sentinel.Api.Tests/Sentinel.Api.Tests.csproj tests/Sentinel.Api.Tests/
RUN dotnet restore Sentinel.sln

COPY . .

# The parity fixtures are generated from packages/domain and live above this
# build context, so the test stage below cannot see them. `make docker-test`
# builds with the repository root as context for that reason; see the note in
# the Makefile.
RUN dotnet publish src/Sentinel.Api/Sentinel.Api.csproj \
    -c Release \
    -o /app \
    --no-restore \
    /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Not root. The API takes uploads from devices in the field and there is no
# reason for the process to be able to write anywhere but its own directory.
RUN adduser --system --uid 5001 --group sentinel
USER 5001

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
EXPOSE 8080

# The image has no shell tooling, so the healthcheck is the runtime asking the
# app about itself — and it is also the only version of the check that cannot
# drift from what the server actually serves.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["dotnet", "Sentinel.Api.dll", "--healthcheck"]

ENTRYPOINT ["dotnet", "Sentinel.Api.dll"]
