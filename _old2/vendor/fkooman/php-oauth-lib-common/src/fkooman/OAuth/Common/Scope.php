<?php

/**
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

namespace fkooman\OAuth\Common;

use fkooman\OAuth\Common\Exception\ScopeException;

class Scope
{
    /** @var array */
    private $scope;

    public function __construct(array $scope = array())
    {
        foreach ($scope as $s) {
            if (!$this->validateScopeToken($s)) {
                throw new ScopeException("invalid scope token");
            }
        }
        $this->scope = array_values($scope);
    }

    public static function fromString($scope)
    {
        if (!is_string($scope)) {
            throw new ScopeException("provided scope must be string");
        }
        if (0 === strlen($scope)) {
            return new self(array());
        }

        return new self(explode(" ", $scope));
    }

    public function isEmpty()
    {
        return 0 === count($this->scope);
    }

    public function hasScope(Scope $that)
    {
        foreach ($that->toArray() as $s) {
            if (!in_array($s, $this->toArray())) {
                return false;
            }
        }

        return true;
    }

    public function hasAnyScope(Scope $that)
    {
        if ($that->isEmpty()) {
            return true;
        }

        foreach ($that->toArray() as $s) {
            if (in_array($s, $this->toArray())) {
                return true;
            }
        }

        return false;
    }

    public function hasOnlyScope(Scope $that)
    {
        if ($this->isEmpty()) {
            return true;
        }

        foreach ($this->toArray() as $s) {
            if (!in_array($s, $that->toArray())) {
                return false;
            }
        }

        return true;
    }

    public function equals(Scope $that)
    {
        $thisScope = $this->toArray();
        $thatScope = $that->toArray();

        foreach ($thisScope as $s) {
            if (!in_array($s, $thatScope)) {
                return false;
            }
        }

        foreach ($thatScope as $s) {
            if (!in_array($s, $thisScope)) {
                return false;
            }
        }

        return true;
    }

    public function toArray()
    {
        return $this->scope;
    }

    public function toString()
    {
        return implode(" ", $this->scope);
    }

    public function __toString()
    {
        return $this->toString();
    }

    private function validateScopeToken($scopeToken)
    {
        if (!is_string($scopeToken) || 0 >= strlen($scopeToken)) {
            throw new ScopeException("scope token must be a non-empty string");
        }
        $scopeTokenRegExp = '/^(?:\x21|[\x23-\x5B]|[\x5D-\x7E])+$/';
        $result = preg_match($scopeTokenRegExp, $scopeToken);

        return 1 === $result;
    }
}
