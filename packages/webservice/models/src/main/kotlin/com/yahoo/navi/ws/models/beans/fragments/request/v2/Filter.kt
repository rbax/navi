/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
package com.yahoo.navi.ws.models.beans.fragments.request.v2

import org.hibernate.annotations.Parameter
import org.hibernate.annotations.Type

data class Filter(
    var field: String,
    @get: Type(type = "com.yahoo.navi.ws.models.types.JsonType", parameters = [
      Parameter(name = "class", value = "kotlin.collections.HashMap")
      ]) var parameters: Map<String, String>,
    var operator: String,
    var values: Array<Any>
) {
    constructor() : this(
            "",
            emptyMap(),
            "",
            emptyArray()
    )
}