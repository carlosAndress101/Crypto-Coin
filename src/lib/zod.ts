import { z } from "zod";

/**
 * Zod configurado para convivir con la CSP. **Importa `z` de aquí, no de `"zod"`.**
 *
 * Zod 4 compila validadores con `Function("")` para ir más rápido y detecta si puede
 * hacerlo probándolo dentro de un `try/catch`. Bajo la CSP de producción —sin
 * `unsafe-eval`— la prueba falla, Zod cae al camino interpretado y todo funciona igual,
 * pero el intento dispara un `securitypolicyviolation` que ensucia la consola y que
 * inundaría cualquier endpoint de informes de CSP con un falso positivo.
 *
 * `jitless: true` se salta la prueba. El detalle que obliga a que esto viva en su propio
 * módulo: Zod lee la bandera **al construir el esquema**, no al validar
 * (`fastEnabled = jit && allowsEval.value`, y el cortocircuito es lo que evita la sonda).
 * Configurarlo desde `main.tsx` llegaba tarde, porque los módulos que definen esquemas se
 * evalúan antes. Exportando `z` desde aquí, el orden queda garantizado por el propio
 * grafo de imports en vez de por convención.
 *
 * El coste es el del parser interpretado, irrelevante aquí: se validan respuestas de una
 * API limitada a ~30 peticiones por minuto, no un flujo de datos.
 *
 * Lo verifica la comprobación de CSP de `scripts/smoke.mjs`.
 */
z.config({ jitless: true });

export { z };
