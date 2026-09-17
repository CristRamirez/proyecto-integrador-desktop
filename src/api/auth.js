const USUARIOS = [
  { usuario: 'admin', clave: '1234', nombre: 'Cristian Ramirez', rol: 'Admin' },
  { usuario: 'lucas', clave: '1234', nombre: 'Lucas Carrasco', rol: 'Operador' },
]

const DEMORA_MS = 600

export function login(usuario, clave) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const buscado = usuario.trim().toLowerCase()
      const cuenta = USUARIOS.find((u) => u.usuario === buscado && u.clave === clave)

      if (!cuenta) {
        reject(new Error('Usuario o contraseña incorrectos'))
        return
      }

      resolve({
        token: `mock-${Date.now()}`,
        usuario: { nombre: cuenta.nombre, rol: cuenta.rol },
      })
    }, DEMORA_MS)
  })
}
