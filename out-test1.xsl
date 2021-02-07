<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:exsl="http://exslt.org/common" extension-element-prefixes="exsl" xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="xs" xmlns:tei="http://www.tei-c.org/ns/1.0">

    <xsl:output method="html" indent="yes" encoding="UTF-8" />

    <!-- définition du texte "de base" : celui qu'on utilisera pour la visualisation html -->
    <xsl:variable name="myfile-name">
        <xsl:text>29.xml</xsl:text>
    </xsl:variable>
    <xsl:variable name="myTEI-id" select="tei:TEI/@xml:id" />

    <!-- création d'une page html vide -->
    <!-- tout ce qui se situe ensuite sert à "remplir" cette page -->
    <!-- le fonctionnement se fait généralement par un système de matchs : pour tel élément dans le xml, on crée tel élément dans la page html -->
    <xsl:template match="/">
        <html>
            <head>
                <title>
                    <xsl:value-of select=".//tei:titleStmt/tei:title" />

                </title>
                <link rel="stylesheet" type="text/css" href="core.css" />
            </head>
            <body>

                <!-- <h3> Contenuto </h3>
                <ol>
                    <xsl:for-each select=".//div">
                        <li>
                            <xsl:apply-templates select="head" mode="toc"/>
                        </li>
                    </xsl:for-each>
                </ol>-->

                <table>
                    <thead>
                        <tr>
                            <xsl:for-each select="//tei:titlePage">
                                <td>

                                    <h1>
                                        <xsl:for-each select="//tei:titlePart">
                                            <xsl:apply-templates />
                                        </xsl:for-each>
                                    </h1>
                                    <h2>
                                        <xsl:for-each select="tei:byline">
                                            <xsl:apply-templates />
                                        </xsl:for-each>
                                    </h2>

                                </td>
                                <td class="td-app">
                                    <div id="appbox" />
                                </td>
                                <td>
                                    <xsl:apply-templates select=".//tei:pb" mode="facs" />
                                </td>

                            </xsl:for-each>
                        </tr>
                    </thead>
                    <xsl:for-each select=".//tei:div">
                        <tr>
                            <td class="td-text">
                                <xsl:apply-templates />
                            </td>
                            <td class="td-app">
                                <div id="appbox" />
                            </td>
                            <td style="vertical-align:top">
                                <xsl:apply-templates select=".//tei:pb" mode="facs" />
                            </td>
                        </tr>
                    </xsl:for-each>
                </table>

            </body>
        </html>
    </xsl:template>


    <xsl:template match="tei:titlePage" />

    <xsl:template match="tei:text">
        <xsl:apply-templates />

    </xsl:template>
    <xsl:template match="tei:div">
        <div>
            <xsl:apply-templates />
        </div>
    </xsl:template>
    <xsl:template match="tei:titlePage">
        <h1>
            <xsl:for-each select="tei:titlePart">
                <xsl:apply-templates />
            </xsl:for-each>
        </h1>
        <h2>
            <xsl:for-each select="tei:byline">
                <xsl:apply-templates />
            </xsl:for-each>
        </h2>
    </xsl:template>
    <xsl:template match="tei:pb">
        [p.
        <xsl:value-of select="@n" />
        ]
    </xsl:template>
    <xsl:template match="tei:pb" mode="facs">
        <xsl:choose>
            <xsl:when test="@facs">

                <div style="padding: 30px 30px 30px 30px">
                    <a href="{@facs}" target="_blank">
                        <img src="{@facs}" style="height:150px; float:right; margin-left:80px" />
                    </a>
                    <p style="height:150px; float:right;text-align:right">
                        [p.
                        <xsl:value-of select="@n" />
                        ]
                    </p>
                </div>
            </xsl:when>
            <xsl:otherwise>
                <div style="text-align:left">
                    [p.
                    <xsl:value-of select="@n" />
                    ]
                </div>
            </xsl:otherwise>
        </xsl:choose>

    </xsl:template>

    <!--    <xsl:template match="tei:w[ancestor::tei:TEI/@xml:id = $myTEI-id]">-->
    <xsl:template match="tei:w">
        <xsl:if test="ancestor::tei:TEI/@xml:id = $myTEI-id">
            <xsl:variable name="w-id-29" select="@xml:id" />
            <span>

                <xsl:if test="document('core-1.xml')//tei:ptr[substring-after(@target, '#') = $w-id-29]">
                    <xsl:attribute name="title">
                        <xsl:for-each select="document('core-1.xml')//tei:ptr[substring-after(@target, '#') = $w-id-29]">
                            <xsl:if test="ancestor::tei:app/tei:rdgGrp">

                                <xsl:choose>
                                    <xsl:when test="ancestor::tei:rdgGrp">
                                        <xsl:for-each select="ancestor::tei:rdgGrp/tei:rdg/tei:ptr[substring-before(@target, '#') != $myfile-name]">
                                            <xsl:variable name="current-filename" select="substring-before(@target, '#')" />

                                            <xsl:variable name="siglum" select="substring-before($current-filename, '.')" />

                                            <xsl:value-of select="$siglum" />
                                            <xsl:text>; </xsl:text>

                                        </xsl:for-each>

                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:for-each select="ancestor::tei:app/tei:rdgGrp">
                                            <xsl:for-each select="tei:rdg[1]/tei:ptr">
                                                <xsl:variable name="current-filename" select="substring-before(@target, '#')" />
                                                <xsl:variable name="siglum" select="substring-before($current-filename, '.')" />
                                                <xsl:variable name="current-w-id" select="substring-after(@target, '#')" />
                                                <xsl:apply-templates select="document($current-filename)//w[@xml:id = $current-w-id]" />
                                                <xsl:text></xsl:text>
                                                <xsl:value-of select="$siglum" />
                                                <xsl:text>, </xsl:text>
                                                <xsl:variable name="currenttarget" select="ancestor::tei:rdgGrp/tei:rdg/tei:ptr[substring-before(@target, '#') != $current-filename]/@target" />

                                                <xsl:value-of select="substring-before(substring-before($currenttarget,'#'),'.')" />
                                            </xsl:for-each>
                                        </xsl:for-each>
                                    </xsl:otherwise>
                                </xsl:choose>


                            </xsl:if>
                            <xsl:if test="ancestor::tei:app/tei:rdg/tei:ptr[substring-before(@target, '#') != $myfile-name]">
                                <xsl:for-each select="ancestor::tei:app/tei:rdg/tei:ptr[substring-before(@target, '#') != $myfile-name]">
                                    <xsl:variable name="current-filename" select="substring-before(@target, '#')" />
                                    <xsl:variable name="siglum" select="substring-before($current-filename, '.')" />
                                    <xsl:variable name="current-w-id" select="substring-after(@target, '#')" />
                                    <xsl:apply-templates select="document($current-filename)//tei:w[@xml:id = $current-w-id]" />
                                    <xsl:text></xsl:text>
                                    <xsl:value-of select="$siglum" />
                                    <xsl:text>; </xsl:text>
                                </xsl:for-each>
                            </xsl:if>
                        </xsl:for-each>
                    </xsl:attribute>
                    <xsl:attribute name="style">
                        <xsl:text>background-color: #FFFAF0; </xsl:text>
                    </xsl:attribute>
                    <xsl:attribute name="onclick">
                        <xsl:text>document.getElementById('appbox').textContent=getAttribute('title')</xsl:text>
                    </xsl:attribute>
                </xsl:if>
                <xsl:apply-templates />
            </span>
        </xsl:if>
    </xsl:template>

    <xsl:template match="choice">
        <xsl:choose>
            <xsl:when test="tei:reg[@type = 'o-atona']">
                <i>
                    <xsl:apply-templates select="tei:orig" />
                </i>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates select="tei:orig" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>


    <xsl:template match="tei:choice" mode="toc">
        <xsl:apply-templates select="tei:reg" mode="toc" />
    </xsl:template>


    <xsl:template match="tei:head" mode="toc">
        <xsl:apply-templates mode="toc" />
    </xsl:template>

    <xsl:template match="tei:head">
        <h2>
            <xsl:apply-templates />
        </h2>
    </xsl:template>

    <xsl:template match="tei:p">
        <p>
            <xsl:apply-templates />
        </p>
    </xsl:template>
    <xsl:template match="tei:teiHeader" />
    <xsl:template match="tei:c">
        <xsl:choose>
            <xsl:when test="@type = 'o-atona'">
                <span style="color:red">
                    <xsl:apply-templates />
                </span>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>
