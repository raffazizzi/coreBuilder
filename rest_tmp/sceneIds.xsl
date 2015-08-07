<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="tei:div[@type='scene']">
        <xsl:copy>
            <xsl:attribute name="xml:id">
                <xsl:text>A</xsl:text>
                <xsl:value-of select="parent::tei:div[@type='act']/@n"/>
                <xsl:text>S</xsl:text>
                <xsl:value-of select="@n"/>
            </xsl:attribute>
            <xsl:apply-templates select="@* except @xml:id | node()"/>
        </xsl:copy>
    </xsl:template>
    
</xsl:stylesheet>