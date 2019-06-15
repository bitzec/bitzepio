@echo off

IF NOT EXIST %AppData%\Bitzec (
    mkdir %AppData%\Bitzec
)

IF NOT EXIST %AppData%\ZcashParams (
    mkdir %AppData%\ZcashParams
)

IF NOT EXIST %AppData%\Bitzec\bitzec.conf (
   (
    echo addnode=35.242.189.203
    echo rpcuser=username
    echo rpcpassword=password%random%%random%
    echo daemon=1
    echo showmetrics=0
    echo gen=4
) > %AppData%\Bitzec\bitzec.conf
)
