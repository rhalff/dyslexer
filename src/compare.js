export default function compare (arr1, arr2) {
  const l = arr1.length
  if (!arr2) return false
  if (arr1.length !== arr2.length) return false
  for (let i = 0; i < l; i++) {
    if (arr1[i] instanceof Array && arr2[i] instanceof Array) {
      if (!arr1[i].compare(arr2[i])) return false
    } else if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

