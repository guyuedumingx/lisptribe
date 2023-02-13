$ErrorActionPreference = "Stop"

Import-Module $PSScriptRoot/interpreter/types.psm1
Import-Module $PSScriptRoot/interpreter/reader.psm1
Import-Module $PSScriptRoot/interpreter/printer.psm1
Import-Module $PSScriptRoot/interpreter/env.psm1
Import-Module $PSScriptRoot/interpreter/core.psm1
Import-Module $PSScriptRoot/interpreter/stepA_mal.psm1

$_ = REP('(load-file "env.mal")')
$_ = REP('(load-file "../init.mal")')
(repl)
# (server "127.0.0.1" 1235)

