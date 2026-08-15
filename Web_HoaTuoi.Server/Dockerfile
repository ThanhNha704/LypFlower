FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "Web_HoaTuoi.Server/Web_hoatuoi.Server.csproj"
RUN dotnet publish "Web_HoaTuoi.Server/Web_hoatuoi.Server.csproj" -c Release -o /app/publish -p:BuildProjectReferences=false
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Web_hoatuoi.Server.dll"]