# Fuego Alpha-7.1
- Execute now runs similar to custom commands
- Font color resets now fixed
- AV Info file check bug now fixed

# Fuego Alpha-7.0
- Fixed FTP no select 1 bug
- Fixed all reported improper error handling bugs
- Added critical error handling
- AV Scan not resetting colors fixed
- `fontColor` and `bgColor` added
- Removed array logging in `av scan`
- Fixed illegal drive operations
- Forced drive names to be lowercase
- Fixed macOS illegal drive un/mount bug
- Fixed non-JS running on boot/shutdown


# Fuego Alpha-6.1
- Added `ftp`

# Fuego Alpha-6.0
- Added operating on directories
- Added `cd`
- Added `/` check on `rm`
- Added AV Scan on `pacman`
- Fixed administrator
- `color` added
- `curl` added
- `date` added
- `mkdir` added
- `find` added
- `ping` added
- `set` added
- `copy` added

# Fuego Alpha-5.0
- Added NDOS 1.2 package fix
- `adminstrator` is now `administrator` 
- Added very basic AntiVirus
- `DATA.AV.AV_INFO` added to the registry
- Remove pre-Fuego versions from the changelog

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