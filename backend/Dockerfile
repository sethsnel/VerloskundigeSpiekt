FROM mcr.microsoft.com/dotnet/sdk:10.0.301@sha256:ea8bde36c11b6e7eec2656d0e59101d4462f6bd630730f2c8201ed0572b295d5 AS build
WORKDIR /src
COPY backend/Directory.Build.props backend/Directory.Packages.props backend/global.json backend/VerloskundigeSpiekt.slnx ./backend/
COPY backend/src ./backend/src
RUN dotnet restore backend/src/VerloskundigeSpiekt.Api/VerloskundigeSpiekt.Api.csproj
RUN dotnet publish backend/src/VerloskundigeSpiekt.Api/VerloskundigeSpiekt.Api.csproj --configuration Release --no-restore --output /app/publish --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:7644f992230d35cf230017189d4038c0ae0f7388b13f4f7ae1900a155bafb597 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
COPY --from=build /app/publish ./
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "VerloskundigeSpiekt.Api.dll"]
