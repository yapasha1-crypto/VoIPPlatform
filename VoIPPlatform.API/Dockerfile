# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["VoIPPlatform.API/VoIPPlatform.API.csproj", "VoIPPlatform.API/"]
RUN dotnet restore "VoIPPlatform.API/VoIPPlatform.API.csproj"

# Copy everything else
COPY . .
WORKDIR "/src/VoIPPlatform.API"
RUN dotnet build "VoIPPlatform.API.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "VoIPPlatform.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Environment Variables (Overridden by docker-compose)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "VoIPPlatform.API.dll"]
