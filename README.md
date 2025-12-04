# Anvil CLI

A powerful Command Line Interface (CLI) tool to rapidly scaffold multi-module Java projects based on a Hexagonal Architecture (Ports & Adapters) with CQRS (Command Query Responsibility Segregation) principles. Anvil simplifies the setup of complex project structures, allowing developers to focus on business logic from day one.

## Features

- **Hexagonal Architecture & CQRS**: Generates a robust project structure (`api`, `application`, `domain`, `infrastructure` modules) adhering to Hexagonal Architecture and CQRS patterns.
- **Configurable Project Details**:
  - **Project Name**: Defines the root project name and artifact ID.
  - **Group ID**: Sets the base package for all modules.
  - **Java Version**: Choose from available LTS and latest Java versions (fetched dynamically from `start.spring.io`).
  - **Spring Boot Version**: Select from available Spring Boot versions (fetched dynamically from `start.spring.io`).
  - **JPA Inclusion**: Option to include Spring Data JPA for relational database persistence.
  - **Database Drivers**: Multi-selection for various database drivers (PostgreSQL, H2, MySQL, MongoDB).
  - **Lombok**: Integrates Lombok for boilerplate code reduction.
  - **MapStruct**: Configures MapStruct for efficient object mapping.
  - **API Style**: Choose between REST, GraphQL, or both for the `api` module (creates respective controller folders).
- **Detailed Folder Structure**: Automatically generates a comprehensive package structure within each module, including example folders for `controllers`, `command`, `query`, `model`, `repository`, `persistence`, `bus`, and `shared` concepts, complete with generic sample files.
- **Ready-to-Use Configuration**:
  - Configures `build.gradle` and `settings.gradle` files for a multi-module Gradle project.
  - Includes `application.yml` in the `api` module (empty, for user configuration).
  - Sets up test folders (`src/test/java`) for all modules.
  - Disables JAR generation for the root project (as it's a multi-module setup).
- **Automatic Gradle Wrapper Generation**: After project creation, it provides instructions to run `gradle wrapper` to set up the `./gradlew` scripts, making the project immediately buildable.

## Usage

To use the CLI, ensure you have Node.js installed. Then, run the following command in your terminal:

```bash
npx anvil
```

The CLI will guide you through a series of interactive prompts to configure your new project. Alternatively, you can provide options directly via command-line arguments (e.g., `npx anvil --projectName my-new-app --javaVersion 17`).

**Example interactive session (output may vary based on selections):**

```
     _                      _   _
    / \     _ __   __   __ (_) | |
   / _ \   | '_ \  \ \ / / | | | |
  / ___ \  | | | |  \ V /  | | | |
 /_/   \_\ |_| |_|   \_/   |_| |_|

✔ Project Name: my-project
✔ Group ID: com.example
✔ Java Version: 25
✔ Spring Boot Version: 4.0.0
✔ Include JPA? Yes
✔ Database Driver: MySQL, MongoDB
✔ Include Lombok? Yes
✔ Include MapStruct? Yes
✔ API Style: REST, GraphQL

📁 Creando proyecto multi-módulo...

✨ Proyecto generado en: /Users/daniel/Developer/Personal/anvil-cli/my-project-api

ℹ️  Please run 'gradle wrapper' in the 'my-project-api' directory to generate Gradle wrapper scripts.
```

After generation, navigate into your new project directory and run the Gradle wrapper command:

```bash
cd my-cool-project
./gradlew build
```

Your project is now ready to build and develop!

## Generated Project Structure Overview

The generated project will have a detailed structure adhering to best practices for Hexagonal Architecture and CQRS. Here’s a brief overview of key directories (example for `com.mycompany` group and `patient` feature):

```
my-cool-project/
├── .gitignore
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
│
├── api/
│   ├── build.gradle
│   └── src/main/java/com/mycompany/
│       ├── MyCoolProjectApiApplication.java
│       ├── config/
│       │   └── SecurityConfig.java
│       └── patient/
│           ├── controllers/rest/
│           │   └── PatientRestController.java
│           ├── controllers/graphql/  # If GraphQL selected
│           │   └── PatientQueryResolver.java
│           ├── mapper/
│           │   └── PatientApiMapper.java
│           └── model/
│               ├── CreatePatientRequest.java
│               └── PatientResponse.java
│
├── application/
│   ├── build.gradle
│   └── src/main/java/com/mycompany/application/
│       └── patient/
│           ├── PatientCommandHandler.java
│           ├── PatientQueryHandler.java
│           ├── PatientEventHandler.java
│           ├── command/
│           │   └── CreatePatientCommand.java
│           └── query/
│               ├── GetPatientByIdQuery.java
│               └── PatientDetails.java
│
├── domain/
│   ├── build.gradle
│   └── src/main/java/com/mycompany/domain/
│       ├── shared/
│       │   ├── model/
│       │   │   └── AggregateRoot.java
│       │   ├── event/
│           │   └── DomainEvent.java
│           └── error/
│               └── ErrorOr.java
│       └── patient/
│           ├── model/
│           │   ├── Patient.java
│           │   └── PatientName.java
│           ├── repository/
│           │   └── PatientRepository.java
│           └── event/
│               └── PatientCreatedEvent.java
│
└── infrastructure/
    ├── build.gradle
    └── src/main/java/com/mycompany/infrastructure/
        ├── bus/
        │   ├── AnnotationDrivenCommandBus.java
        │   ├── AnnotationDrivenQueryBus.java
        │   └── AnnotationDrivenEventBus.java
        └── patient/
            └── persistence/
                ├── entity/
                │   └── PatientDbo.java
                ├── mapper/
                │   └── PatientPersistenceMapper.java
                └── repository/
                    ├── jpa/
                    │   └── PatientJpaRepository.java
                    └── PatientRepositoryImpl.java

```

## Contributing

To contribute to this project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch.
3.  Make your changes.
4.  Lint and format the code:

```bash
npm run lint
```

5.  Create a pull request.
