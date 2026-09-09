/**
 * Conventional Commits. El tipo del commit alimenta el CHANGELOG y la decisión de
 * versión semántica de la Fase 14, así que no es decoración.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // funcionalidad visible para el usuario
        "fix", // corrección de defecto
        "perf", // mejora de rendimiento medida
        "refactor", // cambio interno sin cambio de comportamiento
        "a11y", // accesibilidad
        "style", // formato, sin cambio de código
        "docs",
        "test",
        "build", // dependencias, bundler, tooling de compilación
        "ci",
        "chore",
        "revert",
      ],
    ],
    /* El cuerpo del commit es donde se justifica el cambio. Sin límite estrecho:
       preferimos un commit bien explicado a uno corto. */
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
