dyslexer
========

Dyslexer is a simple lexer to be able to parse custom DSL's

The lexer makes use of scopes, by itself dyslexer will just try to read each and every character, but will not understand any of it.

Dyslexer will start to act ones it recognizes a character within it's current scope.

The default scope is the root scope.

### No Scope

```coffeescript
  'data' -> IN MyProcess(some/component) OUT -> X OtherProcess)
```

Input will just be the output, the dyslexer did not interpret anything


### Root Scope

```coffeescript
+-----------------------------------------------------------------+
+  'data' -> IN MyProcess(some/component) OUT -> X OtherProcess)  +
+-----------------------------------------------------------------+
```

The rootscope is mainly there to delegate to other scopes.
It will make use of it's matchers to do so.
For instance the rootscope must know what to do when the first character
Is encountered, in this case `'`.

The 'data' part indicates data input for this particular DSL. So logically
we have recognized and will define a data scope.

```coffeescript
+----------------------------------------------------------------------+
+ +-----------+                                                        +
+ | DataScope +                                                        +
+ |           +                                                        +
+ |  'data'   + -> IN MyProcess(some/component) OUT -> X OtherProcess) +
+ +-----------+                                                        +
+                                                                      +
+----------------------------------------------------------------------+
```

So then we have learned the rootscope about data scope and isolated datascope,
which then can be re-used, might we have to jump to data scope from other scopes.

Jumping into another scope is one part, knowing how to exit this scope is the job of the particular scope itself.
In the case of datascope, we will exit once we have found an (unescaped) matched quote.

The job of each scope is to detect tokens and present them to the dyslexer.

The DataScope will then be left and we are back at the rootScope.

```coffeescript
+----------------------------------------------------------------------+
+ +-----------+                                                        +
+ | DataScope +                                                        +
+ |           +                                                        +
+ |  'data'   + -> IN MyProcess(some/component) OUT -> X OtherProcess) +
+ +-----------+                                                        +
+                                                                      +
+----------------------------------------------------------------------+
```

TODO: the api can be simplified much more.

### Structure matching.

A structure is a set of tokens which a scope expects, a scope can define several structures
which the dyslexer then can consider to be valid.

This is useful for debugging and error checking.

### Don'ts and concerns
It's pretty easy to define too many scopes but also to few. One could make just one scope
trying to handle each and every token encountered, it could very well be that for some DSL's this is sufficient.
Or define a one to one relation of Scope and Token. It depends on the DSL what would be the best set of scopes
to deal with.
