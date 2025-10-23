# superscss
scss compiler  
playground - https://amazing-faun-79a83a.netlify.app/ 
example:  
```js
const scssCompiler = require("superscss")
console.log(scssCompiler.compile(`
.kek{
    &.lol{
        color:ccc;
    }
}
`
))
```
status: unstable(in development) 
