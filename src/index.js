import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import figlet from 'figlet'
import minimist from 'minimist'
import axios from 'axios'

async function fetchSpringBootVersions() {
  const defaultVersions = {
    versions: ['3.2.0', '3.1.5', '3.0.13', '2.7.18'],
    default: '3.2.0',
  }
  try {
    const response = await axios.get('https://start.spring.io/metadata/client')
    const data = response.data
    const bootVersions = data.bootVersion.values.map((v) =>
      v.id.replace('.RELEASE', '')
    )
    return {
      versions: bootVersions,
      default: data.bootVersion.default.replace('.RELEASE', ''),
    }
  } catch (error) {
    console.error(
      chalk.yellow(
        `\n⚠️  Could not fetch Spring Boot versions from start.spring.io. Using default versions. Error: ${error.message}`
      )
    )
    return defaultVersions
  }
}

async function fetchJavaVersions() {
  const defaultVersions = {
    versions: ['25', '21', '17', '11', '8'],
    default: '25',
  }
  try {
    const response = await axios.get('https://start.spring.io/metadata/client')
    const data = response.data
    const javaVersions = data.javaVersion.values.map((v) => v.id)
    return {
      versions: javaVersions,
      default: data.javaVersion.default,
    }
  } catch (error) {
    console.error(
      chalk.yellow(
        `\n⚠️  Could not fetch Java versions from start.spring.io. Using default versions. Error: ${error.message}`
      )
    )
    return defaultVersions
  }
}

async function createProject({
  projectName,
  groupId,
  javaVersion,
  springbootVersion,
  dbDriver,
  jpa,
  lombok,
  mapstruct,
  apiStyle,
}) {
  const root = path.resolve(process.cwd(), `${projectName}-api`)

  console.log('\n📁 Creando proyecto multi-módulo...')

  // Crear carpeta root del proyecto
  fs.mkdirSync(root, { recursive: true })

  // settings.gradle
  const settingsGradle = `
rootProject.name = "${projectName}-api"

include("domain")
include("application")
include("infrastructure")
include("api")
`
  fs.writeFileSync(`${root}/settings.gradle`, settingsGradle)

  // root build.gradle
  const rootBuildGradle = `
plugins {
    id 'java'
    id 'org.springframework.boot' version '${springbootVersion}' apply false
    id 'io.spring.dependency-management' version '1.1.5'
}

allprojects {
    group = '${groupId}'
    version = '0.0.1-SNAPSHOT'

    repositories {
        mavenCentral()
    }
}

// Disable the jar task for the root project
jar.enabled = false

subprojects {
    apply plugin: 'java'
    apply plugin: 'io.spring.dependency-management'

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(${javaVersion})
        }
    }

    dependencies {
        ${
          lombok
            ? `
        compileOnly 'org.projectlombok:lombok:1.18.42'
        annotationProcessor 'org.projectlombok:lombok:1.18.42'
        testCompileOnly 'org.projectlombok:lombok:1.18.42'
        testAnnotationProcessor 'org.projectlombok:lombok:1.18.42'
`
            : ''
        }
        ${
          mapstruct
            ? `
        implementation 'org.mapstruct:mapstruct:1.5.5.Final'
        annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
`
            : ''
        }
    }

    tasks.withType(JavaCompile) {
        options.compilerArgs = [
            '-Amapstruct.defaultComponentModel=spring'
        ]
    }
}
`
  fs.writeFileSync(`${root}/build.gradle`, rootBuildGradle)

  // Módulos
  const modules = ['api', 'application', 'domain', 'infrastructure']
  for (const module of modules) {
    const modulePath = `${root}/${module}`
    const basePkgPath = groupId.replace(/\./g, '/') // Base package path based on groupId

    // Create main java and test java folders for each module, under the base package
    fs.mkdirSync(`${modulePath}/src/main/java/${basePkgPath}`, {
      recursive: true,
    })
    fs.mkdirSync(`${modulePath}/src/test/java/${basePkgPath}`, {
      recursive: true,
    })

    // Create resources folder for api module and application.yml
    if (module === 'api') {
      fs.mkdirSync(`${modulePath}/src/main/resources`, { recursive: true })
      fs.writeFileSync(`${modulePath}/src/main/resources/application.yml`, '')
    }

    // Create detailed folder structure and sample files
    switch (module) {
      case 'api': {
        const apiBasePkg = `${modulePath}/src/main/java/${basePkgPath}`
        fs.mkdirSync(`${apiBasePkg}/config`, { recursive: true })
        fs.writeFileSync(
          `${apiBasePkg}/config/SecurityConfig.java`,
          `package ${groupId}.config;

public class SecurityConfig {}`
        )

        const patientFeaturePkg = `${apiBasePkg}/patient` // Example feature package
        fs.mkdirSync(patientFeaturePkg, { recursive: true })

        if (apiStyle && apiStyle.includes('REST')) {
          fs.mkdirSync(`${patientFeaturePkg}/controllers/rest`, {
            recursive: true,
          })
          fs.writeFileSync(
            `${patientFeaturePkg}/controllers/rest/PatientRestController.java`,
            `package ${groupId}.patient.controllers.rest;

public class PatientRestController {}`
          )
        }
        if (apiStyle && apiStyle.includes('GraphQL')) {
          fs.mkdirSync(`${patientFeaturePkg}/controllers/graphql`, {
            recursive: true,
          })
          fs.writeFileSync(
            `${patientFeaturePkg}/controllers/graphql/PatientQueryResolver.java`,
            `package ${groupId}.patient.controllers.graphql;

public class PatientQueryResolver {}`
          )
        }
        fs.mkdirSync(`${patientFeaturePkg}/mapper`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/mapper/PatientApiMapper.java`,
          `package ${groupId}.patient.mapper;

public interface PatientApiMapper {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/model`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/model/CreatePatientRequest.java`,
          `package ${groupId}.patient.model;

public class CreatePatientRequest {}`
        )
        fs.writeFileSync(
          `${patientFeaturePkg}/model/PatientResponse.java`,
          `package ${groupId}.patient.model;

public class PatientResponse {}`
        )
        break
      }
      case 'application': {
        const appBasePkg = `${modulePath}/src/main/java/${basePkgPath}/application`
        const patientFeaturePkg = `${appBasePkg}/patient`
        fs.mkdirSync(patientFeaturePkg, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/PatientCommandHandler.java`,
          `package ${groupId}.application.patient;

public class PatientCommandHandler {}`
        )
        fs.writeFileSync(
          `${patientFeaturePkg}/PatientQueryHandler.java`,
          `package ${groupId}.application.patient;

public class PatientQueryHandler {}`
        )
        fs.writeFileSync(
          `${patientFeaturePkg}/PatientEventHandler.java`,
          `package ${groupId}.application.patient;

public class PatientEventHandler {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/command`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/command/CreatePatientCommand.java`,
          `package ${groupId}.application.patient.command;

public class CreatePatientCommand {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/query`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/query/GetPatientByIdQuery.java`,
          `package ${groupId}.application.patient.query;

public class GetPatientByIdQuery {}`
        )
        fs.writeFileSync(
          `${patientFeaturePkg}/query/PatientDetails.java`,
          `package ${groupId}.application.patient.query;

public class PatientDetails {}`
        )
        break
      }
      case 'domain': {
        const domainBasePkg = `${modulePath}/src/main/java/${basePkgPath}/domain`
        fs.mkdirSync(`${domainBasePkg}/shared/model`, { recursive: true })
        fs.writeFileSync(
          `${domainBasePkg}/shared/model/AggregateRoot.java`,
          `package ${groupId}.domain.shared.model;

public abstract class AggregateRoot {}`
        )
        fs.mkdirSync(`${domainBasePkg}/shared/event`, { recursive: true })
        fs.writeFileSync(
          `${domainBasePkg}/shared/event/DomainEvent.java`,
          `package ${groupId}.domain.shared.event;

public interface DomainEvent {}`
        )
        fs.mkdirSync(`${domainBasePkg}/shared/error`, { recursive: true })
        fs.writeFileSync(
          `${domainBasePkg}/shared/error/ErrorOr.java`,
          `package ${groupId}.domain.shared.error;

public class ErrorOr {}`
        )

        const patientFeaturePkg = `${domainBasePkg}/patient`
        fs.mkdirSync(patientFeaturePkg, { recursive: true })
        fs.mkdirSync(`${patientFeaturePkg}/model`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/model/Patient.java`,
          `package ${groupId}.domain.patient.model;

public class Patient {}`
        )
        fs.writeFileSync(
          `${patientFeaturePkg}/model/PatientName.java`,
          `package ${groupId}.domain.patient.model;

public class PatientName {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/repository`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/repository/PatientRepository.java`,
          `package ${groupId}.domain.patient.repository;

public interface PatientRepository {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/event`, { recursive: true })
        fs.writeFileSync(
          `${patientFeaturePkg}/event/PatientCreatedEvent.java`,
          `package ${groupId}.domain.patient.event;

public class PatientCreatedEvent {}`
        )
        break
      }
      case 'infrastructure': {
        const infraBasePkg = `${modulePath}/src/main/java/${basePkgPath}/infrastructure`
        fs.mkdirSync(`${infraBasePkg}/bus`, { recursive: true })
        fs.writeFileSync(
          `${infraBasePkg}/bus/AnnotationDrivenCommandBus.java`,
          `package ${groupId}.infrastructure.bus;

public class AnnotationDrivenCommandBus {}`
        )
        fs.writeFileSync(
          `${infraBasePkg}/bus/AnnotationDrivenQueryBus.java`,
          `package ${groupId}.infrastructure.bus;

public class AnnotationDrivenQueryBus {}`
        )
        fs.writeFileSync(
          `${infraBasePkg}/bus/AnnotationDrivenEventBus.java`,
          `package ${groupId}.infrastructure.bus;

public class AnnotationDrivenEventBus {}`
        )

        const patientFeaturePkg = `${infraBasePkg}/patient`
        fs.mkdirSync(patientFeaturePkg, { recursive: true })
        fs.mkdirSync(`${patientFeaturePkg}/persistence/entity`, {
          recursive: true,
        })
        fs.writeFileSync(
          `${patientFeaturePkg}/persistence/entity/PatientDbo.java`,
          `package ${groupId}.infrastructure.patient.persistence.entity;

public class PatientDbo {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/persistence/mapper`, {
          recursive: true,
        })
        fs.writeFileSync(
          `${patientFeaturePkg}/persistence/mapper/PatientPersistenceMapper.java`,
          `package ${groupId}.infrastructure.patient.persistence.mapper;

public interface PatientPersistenceMapper {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/persistence/repository`, {
          recursive: true,
        })
        fs.writeFileSync(
          `${patientFeaturePkg}/persistence/repository/PatientRepositoryImpl.java`,
          `package ${groupId}.infrastructure.patient.persistence.repository;

public class PatientRepositoryImpl {}`
        )
        fs.mkdirSync(`${patientFeaturePkg}/persistence/repository/jpa`, {
          recursive: true,
        })
        fs.writeFileSync(
          `${patientFeaturePkg}/persistence/repository/jpa/PatientJpaRepository.java`,
          `package ${groupId}.infrastructure.patient.persistence.repository.jpa;

public interface PatientJpaRepository {}`
        )
        break
      }
    }

    let moduleBuildGradle = ''
    switch (module) {
      case 'domain':
        moduleBuildGradle = `
dependencies {
}

jar {
    enabled = true
}
`
        break
      case 'application':
        moduleBuildGradle = `
dependencies {
    implementation project(':domain')
}

jar {
    enabled = true
}
`
        break
      case 'infrastructure':
        moduleBuildGradle = `
plugins {
    id 'java'
    id 'io.spring.dependency-management'
}

dependencies {
    implementation platform("org.springframework.boot:spring-boot-dependencies:${springbootVersion}")
    implementation project(':domain')
    implementation project(':application')
${
  jpa
    ? `
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
`
    : ''
}
${
  dbDriver && dbDriver.includes('PostgreSQL')
    ? `
    runtimeOnly 'org.postgresql:postgresql'
`
    : ''
}
${
  dbDriver && dbDriver.includes('H2')
    ? `
    runtimeOnly 'com.h2database:h2'
`
    : ''
}
${
  dbDriver && dbDriver.includes('MySQL')
    ? `
    runtimeOnly 'mysql:mysql-connector-java:8.0.33'
`
    : ''
}
${
  dbDriver && dbDriver.includes('MongoDB')
    ? `
    implementation 'org.springframework.boot:spring-boot-starter-data-mongodb'
`
    : ''
}
}

jar {
    enabled = true
}
`
        break
      case 'api': {
        const mainClassName = `${projectName.charAt(0).toUpperCase()}${projectName.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}ApiApplication`
        moduleBuildGradle = `
plugins {
    id 'java'
    id 'org.springframework.boot'
    id 'io.spring.dependency-management'
}

dependencies {
    implementation project(':application')
    implementation project(':infrastructure')

    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-graphql'
    implementation 'com.fasterxml.jackson.core:jackson-databind'
}
`
        // Main application class
        const mainClassContent = `
package ${groupId};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${mainClassName} {

    public static void main(String[] args) {
        SpringApplication.run(${mainClassName}.class, args);
    }
}
`
        const mainClassPkgPath = `${modulePath}/src/main/java/${groupId.replace(/\./g, '/')}` // Corrected path based on groupId
        fs.writeFileSync(
          `${mainClassPkgPath}/${mainClassName}.java`,
          mainClassContent
        )
        break
      }
    }
    fs.writeFileSync(`${modulePath}/build.gradle`, moduleBuildGradle)
  }

  console.log(`\n✨ Proyecto generado en: ${root}\n`)

  // Inform the user to run gradle wrapper manually
  console.log(
    `ℹ️  Please run 'gradle wrapper' in the '${path.basename(root)}' directory to generate Gradle wrapper scripts.`
  )
}

async function main() {
  console.log(
    chalk.green(figlet.textSync('Anvil', { horizontalLayout: 'full' }))
  )

  const argv = minimist(process.argv.slice(2))

  const { versions: springBootVersions, default: defaultSpringBootVersion } =
    await fetchSpringBootVersions()

  const { versions: javaVersions, default: defaultJavaVersion } =
    await fetchJavaVersions()

  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name:',
      default: argv.projectName || 'my-project',
    },
    {
      type: 'input',
      name: 'groupId',
      message: 'Group ID:',
      default: argv.groupId || 'com.example',
    },
    {
      type: 'rawlist',
      name: 'javaVersion',
      message: 'Java Version:',
      choices: javaVersions,
      default: defaultJavaVersion,
    },
    {
      type: 'rawlist',
      name: 'springbootVersion',
      message: 'Spring Boot Version:',
      choices: springBootVersions,
      default: defaultSpringBootVersion,
    },
    {
      type: 'confirm',
      name: 'jpa',
      message: 'Include JPA?',
      default: true,
    },
    {
      type: 'checkbox',
      name: 'dbDriver',
      message: 'Database Driver:',
      choices: ['PostgreSQL', 'H2', 'MySQL', 'MongoDB'],
      when: (answers) => answers.jpa,
    },
    {
      type: 'confirm',
      name: 'lombok',
      message: 'Include Lombok?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'mapstruct',
      message: 'Include MapStruct?',
      default: true,
    },
    {
      type: 'checkbox',
      name: 'apiStyle',
      message: 'API Style:',
      choices: ['REST', 'GraphQL'],
      default: ['REST'],
      when: (answers) => answers.springbootVersion !== 'No',
    },
  ]
  const answers = await inquirer.prompt(questions)
  answers.artifactId = answers.projectName // Set artifactId to projectName
  answers.packageName = `${answers.groupId}.${answers.projectName.replace(/-/g, '')}`
  await createProject(answers)
}

main()
