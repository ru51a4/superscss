# superscss
scss compiler  
playground - http://superscss.surge.sh  
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
