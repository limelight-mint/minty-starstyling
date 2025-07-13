# Change Log

All notable changes to the "minty-starstyling" extension will be documented in this file.
Based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

- Initial release

## [0.1.1] - 2025-07-12

### Added

- TypeScript support

### Fixed

- TypeScript return types

## [0.1.2] - 2025-07-12

### Added

- Icon

## [0.2.0] - 2025-07-12

### Added

- Imports/Require support
- Comments support
- Custom Icon from https://minty.bar

### Fixed

- Comments being treated as text
- Comments being treated as functions
- Imports being treated as functions
- Imports collapse

## [0.2.1] - 2025-07-13

### Added

- Custom Imports/Require line spacings
- Custom Class/Constructor line spacings
- Custom Functions/Exports line spacings

### Fixed

- Imports now have spacings after the block not just collapsing together
- Promises now have better endings and do not transfer to the next line if they were together (no spaces)
- return and anonymous object blocks are now calculate brackets and return types properly