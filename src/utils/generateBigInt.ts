export const generateBigIntId = () => {
  const timestamp = BigInt(Date.now()) // milissegundos
  const random = BigInt(Math.floor(Math.random() * 1_000_000)) // até 6 dígitos aleatórios
  const bigintId = timestamp * 1_000_000n + random
  return bigintId.toString()
}
