# Fuego Alpha-4.1
- Added remove command

# Fuego Alpha-4.0
- jpacV2 implemented

# Fuego Alpha-3.1.1
- Changed `START.MENU.START_DEFAULT` to `false` by default
- Disabled developer notes by default
- Added build name to help

# Fuego Alpha-3.1
- Added all new commands to `help`
- Fixed the registry

# Fuego Alpha-3.0
- Added the start menu
- Added `START_MENU.START_DEFAULT` to the registry
- Added `START_MENU.COMMANDS` to the registry

# Fuego Alpha-2.1.1
- Fixed release

# Fuego Alpha-2.1
- Added `Other user` to the login menu
- Added menu to `mount`
- Added menu to `unmount`

# Fuego Alpha-2.0
- Added support for menus
- Added login menu (capped at 9 users)
- Added user administrator check before using `newuser`

# Fuego Alpha-1.1
- Added `newuser`
- Added `lock`
- Added user administrator check before checking `DISABLE_CMD_LOGGING_NOTIFICATION`
- Changed passwords to utf8 -> sha256 -> base64 (previously utf8 -> base64)


# Fuego Alpha-1.0
- Added login system 
- Added `ROOT_USER_WARNING` to the registry
- Locked `bus` behind admin permissions
- Added users log

# 1.1
- Fixed year
- Adjusted `newdrive` for verification on if a drive already exists or uses invalid characters
- Added basic `jpac` and `pacman` responses (may be edited in the future)
- Added start scripts

# 1.01
- Added `reboot` command
- Added `shutdown` command

# 1.0
- Added boot folders
- Added Discord into dev notes
- Added modifications notice
- Moved version and date to registry
- Added toggle of shutdown scripts in registry
- Added error catching for `exit`, `jpac` and `pacman`
- Added `bus` command

# alpha-0.8
- Added registry

# alpha-0.7
- Added `pacman` command
- Added `echo` command
- Added `eval` command

# alpha-0.6.1
- Encoded files for drives in Base64

# alpha-0.6
- Added syntax into `help` commands listing
- Added `jpac` command

# alpha-0.5
- Added `unmount` command

# alpha-0.4
- Added `newdrive` command
- Added `mount` command

# alpha-0.3
- Added `read` command
- Added `execute` command

# alpha-0.2
- Added commands into `help` command

# alpha-0.1
- Initial release