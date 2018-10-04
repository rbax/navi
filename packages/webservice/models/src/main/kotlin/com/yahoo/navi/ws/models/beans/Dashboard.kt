package com.yahoo.navi.ws.models.beans

import com.yahoo.elide.annotation.Include
import com.yahoo.elide.annotation.SharePermission
import com.yahoo.elide.annotation.DeletePermission
import com.yahoo.elide.annotation.CreatePermission
import com.yahoo.elide.annotation.UpdatePermission
import com.yahoo.navi.ws.models.beans.fragments.DashboardPresentation

import org.hibernate.annotations.Parameter
import org.hibernate.annotations.Type
import javax.persistence.CascadeType

import javax.persistence.Entity
import javax.persistence.Table
import javax.persistence.Column
import javax.persistence.JoinColumn
import javax.persistence.ManyToMany
import javax.persistence.ManyToOne
import javax.persistence.OneToMany

@Entity(name = "Dashboard")
@Table(name="custom_dashboards")
@Include(rootLevel = true, type = "dashboards")
@SharePermission
@CreatePermission(expression = "is an author")
@UpdatePermission(expression = "is an author now OR is an editor now")
@DeletePermission(expression = "is an author now")
class Dashboard : Asset(), HasAuthor, HasEditors {

    @get:JoinColumn(name = "author")
    @get:ManyToOne
    override var author: User? = null

    @get:ManyToMany(mappedBy = "editingDashboards")
    override var editors: Collection<User> = arrayListOf()

    @get:Column(name = "presentation", columnDefinition = "MEDIUMTEXT")
    @get:Type(type = "com.yahoo.navi.ws.models.types.JsonType", parameters = arrayOf(
            Parameter(name = "class", value = "com.yahoo.navi.ws.models.beans.fragments.DashboardPresentation")
    ))
    var presentation: DashboardPresentation? = null

    @get:OneToMany(mappedBy = "dashboard", cascade = arrayOf(CascadeType.REMOVE), orphanRemoval = true)
    var widgets: Collection<DashboardWidget> = emptyList()
}