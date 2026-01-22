export function mulberry32(seed){
  let a = seed | 0;
  return {
    next(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max){
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(arr){
      return arr[Math.floor(this.next() * arr.length)];
    }
  };
}
